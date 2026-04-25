/*---------------------------------------------
Template name:  Oxpitan
Version:        1.0
Author:         Layerdrops
Description:    Oxpitan - Nonprofit Charity and Fundraising HTML5 Template
Author Email:   layerdrops@gmail.com


[Table of Content]

01: Preloader
02: side-widget-menu
03: Mobile Menu Open Control
04: Mobile Menu Close Control
05: Back to Top Button and navbar scrolling effects
06: back to top button click control
07: Counter up
08: homepage-slide1
09: barfiller
10: fun-content-slide
11: Client logo
12: magnific-popup
13: lightbox
14: FAQ
15: animated skills
26: accordion
----------------------------------------------*/

(function ($) {
  "use strict"; //use of strict

  $(document).ready(function () {
    /*==== Preloader =====*/
    $(window).on("load", function () {
      $("#loading-area").delay("500").fadeOut(2000);
    });

    /*====  side-widget-menu  =====*/
    $(document).on("click", ".side-menu-wrap .side-menu-ul .sidenav__item .menu-plus-icon", function () {
      $(this).closest(".sidenav__item").siblings().removeClass("active").find(".side-sub-menu").slideUp(200);
      $(this).closest(".sidenav__item").toggleClass("active").find(".side-sub-menu").slideToggle(200);
      return false;
    });

    /*=========== Mobile Menu Open Control ============*/
    $(document).on("click", ".mobile-menu-toggle", function () {
      $(".side-nav-container").addClass("active");
    });

    /*=========== Mobile Menu Close Control ============*/
    $(document).on("click", ".side-menu-close", function () {
      $(".side-nav-container").removeClass("active");
    });

    /*===== Back to Top Button and navbar scrolling effects ======*/
    $(window).on("scroll", function () {
      //header fixed animation and control
      if ($(window).scrollTop() > 100) {
        $(".header-top").removeClass("header-fixed");
      } else {
        $(".header-top").removeClass("header-fixed");
      }

      //back to top button control
      if ($(window).scrollTop() > 300) {
        $("#back-to-top").addClass("back-btn-shown");
      } else {
        $("#back-to-top").removeClass("back-btn-shown");
      }
    });

    /*===== back to top button click control ======*/
    $(document).on("click", "#back-to-top", function () {
      $("html, body").animate(
        {
          scrollTop: 0,
        },
        800
      );
      return false;
    });

    /*==== Counter up =====*/
    $(".counter").counterUp({
      delay: 10,
      time: 1000,
    });

    /*==== barfiller =====*/
    $("#bar1").barfiller({ barColor: "#50bac3", duration: 3000 });
    $("#bar2").barfiller({ barColor: "#17458f", duration: 3000 });
    $("#bar3").barfiller({ barColor: "#F7A50A", duration: 3000 });
    $("#bar4").barfiller({ barColor: "#901f93", duration: 3000 });
    $("#bar5").barfiller({ barColor: "#50bac3", duration: 3000 });
    $("#bar6").barfiller({ barColor: "#17458f", duration: 3000 });

    /*==== homepage-slide1 =====*/
    $(".homepage-slide1").owlCarousel({
      items: 1,
      nav: false,
      dots: true,
      autoplay: true,
      loop: true,
      smartSpeed: 1000,
      animateOut: "slideOutDown",
      animateIn: "fadeIn",
      active: true,
    });

    $(".homepage-slide1.owl-carousel").on("translate.owl.carousel", function () {
      $(".single-slide-item .slider__title").removeClass("animated pulse").css("opacity", "0");
      $(".single-slide-item .slider__meta").removeClass("animated fadeInUp").css("opacity", "0");
      $(".single-slide-item .theme-btn").removeClass("animated fadeInDown").css("opacity", "0");
    });

    $(".homepage-slide1.owl-carousel").on("translated.owl.carousel", function () {
      $(".single-slide-item .slider__title").addClass("animated pulse").css("opacity", "1");
      $(".single-slide-item .slider__meta").addClass("animated fadeInUp").css("opacity", "1");
      $(".single-slide-item .theme-btn").addClass("animated fadeInDown").css("opacity", "1");
    });

    /*==== fun-content-slide =====*/
    $(".fun-content-slide").owlCarousel({
      loop: true,
      items: 1,
      nav: false,
      dots: true,
      smartSpeed: 500,
      autoplay: true,
    });

    /*==== gallery-carousel =====*/
    $(".gallery-carousel").owlCarousel({
      loop: true,
      items: 3,
      nav: false,
      dots: true,
      smartSpeed: 700,
      autoplay: true,
      margin: 15,
      responsive: {
        // breakpoint from 0 up
        0: {
          items: 1,
        },
        // breakpoint from 600 up
        600: {
          items: 2,
        },
        // breakpoint from 991 up
        1199: {
          items: 3,
        },
      },
    });

    /*==== Client logo =====*/
    $(".client-logo").owlCarousel({
      loop: true,
      items: 5,
      nav: false,
      dots: false,
      smartSpeed: 700,
      autoplay: true,
      responsive: {
        // breakpoint from 0 up
        0: {
          items: 1,
        },
        // breakpoint from 481 up
        480: {
          items: 2,
        },
        // breakpoint from 481 up
        991: {
          items: 4,
        },
        // breakpoint from 992 up
        992: {
          items: 5,
        },
      },
    });

    /*==== magnific-popup =====*/
    $(".video-play-btn").magnificPopup({
      type: "iframe",
      iframe: {
        patterns: {
          youtube: {
            index: "youtube.com/",
            id: function (url) {
              var m = url.match(/(?:v=|youtu\.be\/)([A-Za-z0-9_-]+)/);
              return m && m[1] ? m[1] : null;
            },
            src: "https://www.youtube.com/embed/%id%?autoplay=1&origin=" + encodeURIComponent(window.location.origin),
          },
        },
      },
    });

    /*==== lightbox =====*/
    lightbox.option({
      resizeDuration: 200,
      wrapAround: true,
    });

    /*====  FAQ  =====*/
    $(document).on("click", ".faq-heading", function () {
      $(this).closest(".faq-panel").siblings().removeClass("active").find(".faq-content").slideUp(200);
      $(this).closest(".faq-panel").toggleClass("active").find(".faq-content").slideToggle(200);
      return false;
    });

    // animated skills
    $(window).on("scroll", function () {
      var my_skill = ".skill-area .skills .skill";
      if ($(my_skill).length !== 0) {
        spy_scroll(my_skill);
      }
    });

    /*====  accordion  =====*/
    $(document).on("click", ".accordion__title", function () {
      $(this).closest(".accordion-panel").siblings().removeClass("active").find(".accordion__content").slideUp(200);
      $(this).closest(".accordion-panel").toggleClass("active").find(".accordion__content").slideToggle(200);
      return false;
    });
  });
})(jQuery);
